import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';

/**
 * Interface cho Wallet Adapter (như Phantom, Solflare, Mobile Wallet Adapter, v.v.)
 */
export interface WalletAdapterSigner {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

/**
 * Loại đối tượng người dùng có thể dùng để ký giao dịch: Keypair nội bộ hoặc Wallet Adapter
 */
export type UserSigner = Keypair | WalletAdapterSigner;

/**
 * Tuỳ chọn bổ sung khi gửi giao dịch được tài trợ gas
 */
export interface SendSponsoredTransactionOptions {
  /**
   * Endpoint API nhận giao dịch ký một phần để Relayer bảo trợ (mặc định: '/api/sponsor-tx')
   */
  apiUrl?: string;

  /**
   * Endpoint API lấy địa chỉ ví Relayer (mặc định: '/api/relayer-balance')
   */
  relayerBalanceApiUrl?: string;

  /**
   * Địa chỉ ví Relayer (nếu đã biết trước, tránh một request phụ)
   */
  relayerPublicKey?: PublicKey | string;

  /**
   * Custom fetch headers nếu cần authentication / authorization
   */
  headers?: Record<string, string>;
}

/**
 * Kết quả trả về sau khi giao dịch được tài trợ và gửi lên mạng lưới thành công
 */
export interface SponsoredTransactionResponse {
  success: boolean;
  signature: string;
  explorerUrl: string;
}

// Bộ nhớ đệm tạm thời cho địa chỉ ví Relayer phía client để tối ưu tốc độ
let cachedRelayerPublicKey: PublicKey | null = null;

/**
 * Lấy địa chỉ ví Relayer từ backend API
 */
export async function getRelayerPublicKey(
  relayerBalanceApiUrl = '/api/relayer-balance'
): Promise<PublicKey> {
  if (cachedRelayerPublicKey) {
    return cachedRelayerPublicKey;
  }

  const res = await fetch(relayerBalanceApiUrl);
  if (!res.ok) {
    throw new Error(
      `Không thể truy vấn thông tin ví Relayer từ API (${res.status}: ${res.statusText})`
    );
  }

  const data = await res.json();
  if (!data?.address) {
    throw new Error(
      'Phản hồi từ API /api/relayer-balance không chứa trường address hợp lệ.'
    );
  }

  cachedRelayerPublicKey = new PublicKey(data.address);
  return cachedRelayerPublicKey;
}

/**
 * Reset cache ví Relayer phía client (dùng khi thay đổi mạng hoặc tài khoản quản trị)
 */
export function clearRelayerCache(): void {
  cachedRelayerPublicKey = null;
}

/**
 * Gửi một giao dịch được tài trợ phí gas (Gasless Transaction) lên Solana thông qua N.E.D Hub Relayer.
 *
 * @param connection Đối tượng Connection kết nối tới mạng lưới Solana
 * @param transaction Đối tượng Transaction chứa các instruction cần thực thi
 * @param userSigner Keypair hoặc Wallet Adapter của người dùng
 * @param options Các tuỳ chọn bổ sung (apiUrl, relayerPublicKey, v.v.)
 * @returns Promise<SponsoredTransactionResponse> Chứa chữ ký giao dịch (signature) và link Solana Explorer
 */
export async function sendSponsoredTransaction(
  connection: Connection,
  transaction: Transaction,
  userSigner: UserSigner,
  options?: SendSponsoredTransactionOptions
): Promise<SponsoredTransactionResponse> {
  const apiUrl = options?.apiUrl || '/api/sponsor-tx';
  const relayerApiUrl = options?.relayerBalanceApiUrl || '/api/relayer-balance';

  // 1. Tự động fetch blockhash mới nhất từ mạng lưới nếu transaction chưa có
  if (!transaction.recentBlockhash) {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
  }

  // 2. Thiết lập feePayer là ví Relayer
  if (!transaction.feePayer) {
    if (options?.relayerPublicKey) {
      transaction.feePayer =
        typeof options.relayerPublicKey === 'string'
          ? new PublicKey(options.relayerPublicKey)
          : options.relayerPublicKey;
    } else {
      transaction.feePayer = await getRelayerPublicKey(relayerApiUrl);
    }
  }

  // 3. Ký xác thực phần hành động của người dùng (partialSign)
  if ('secretKey' in userSigner && userSigner.secretKey instanceof Uint8Array) {
    // Trường hợp là Keypair (@solana/web3.js)
    transaction.partialSign(userSigner);
  } else if (
    'signTransaction' in userSigner &&
    typeof userSigner.signTransaction === 'function'
  ) {
    // Trường hợp là Wallet Adapter (Phantom, Solflare, Mobile Wallet Adapter, v.v.)
    transaction = await userSigner.signTransaction(transaction);
  } else {
    throw new Error(
      'Đối tượng userSigner không hợp lệ. Vui lòng truyền vào một Keypair hoặc một Wallet Adapter có phương thức signTransaction.'
    );
  }

  // 4. Chuyển đổi giao dịch đã ký một phần thành chuỗi Base64
  const partialTransaction = transaction
    .serialize({ requireAllSignatures: false })
    .toString('base64');

  // 5. Gửi request lên Backend API (/api/sponsor-tx)
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    body: JSON.stringify({
      partialTransaction,
    }),
  });

  const result = await response.json();

  // 6. Xử lý phản hồi
  if (!response.ok || !result.success) {
    const errorMessage =
      result?.error ||
      result?.details ||
      `Lỗi máy chủ (${response.status}): ${response.statusText}`;
    throw new Error(`Gasless Transaction Failed: ${errorMessage}`);
  }

  const signature = result.signature as string;
  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  return {
    success: true,
    signature,
    explorerUrl,
  };
}
