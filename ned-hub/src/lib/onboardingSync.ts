export type OnboardingStatus =
  | 'auth'
  | 'otp_verified'
  | 'name_selected'
  | 'minted';

export interface OnboardingExtraData {
  username?: string;
  phone_hash?: string;
  signature?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OnboardingSyncResult {
  success: boolean;
  data?: Record<string, unknown> | null;
  error?: string;
}

/**
 * Cập nhật hoặc upsert tiến trình Onboarding của người dùng vào bảng users trên Supabase.
 * Hỗ trợ chạy linh hoạt trên cả môi trường Server (API) và Client (React/Mobile App).
 *
 * @param walletAddress Địa chỉ ví công khai của người dùng (Public Key Base58)
 * @param newStatus Trạng thái mới trong phễu ('auth' | 'otp_verified' | 'name_selected' | 'minted')
 * @param extraData Dữ liệu bổ sung (username, phone_hash, signature, v.v.)
 * @param apiBaseUrl URL gốc của API (mặc định '' trên browser hoặc 'http://localhost:3000')
 */
export async function updateUserOnboardingStatus(
  walletAddress: string,
  newStatus: OnboardingStatus,
  extraData?: OnboardingExtraData,
  apiBaseUrl = ''
): Promise<OnboardingSyncResult> {
  if (!walletAddress || typeof walletAddress !== 'string') {
    return {
      success: false,
      error: 'Địa chỉ ví walletAddress không hợp lệ hoặc để trống.',
    };
  }

  // 1. Nếu đang chạy trên Server-side (có biến môi trường SUPABASE_SERVICE_ROLE_KEY)
  const isServer = typeof window === 'undefined';
  if (isServer && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase');

      const payload: Record<string, unknown> = {
        wallet_address: walletAddress.trim(),
        onboarding_status: newStatus,
        ...(extraData?.username ? { username: extraData.username } : {}),
        ...(extraData?.phone_hash ? { phone_hash: extraData.phone_hash } : {}),
      };

      const { data, error } = await supabaseAdmin
        .from('users')
        .upsert(payload, { onConflict: 'wallet_address' })
        .select();

      if (error) {
        console.error('Lỗi khi upsert vào bảng users trên Supabase (Server-side):', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: (data?.[0] as Record<string, unknown>) || null,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: msg,
      };
    }
  }

  // 2. Nếu đang chạy trên Client-side hoặc thông qua API router:
  try {
    const endpoint = `${apiBaseUrl}/api/update-onboarding-status`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress.trim(),
        newStatus,
        extraData,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorMessage =
        result?.error ||
        `Lỗi HTTP ${response.status}: Không thể cập nhật trạng thái người dùng`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: result.data || null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Helper chuyên biệt: Tự động đánh dấu người dùng đã 'minted' on-chain sau khi nhận được signature từ Relayer
 *
 * @param walletAddress Địa chỉ ví người dùng
 * @param signature Mã chữ ký giao dịch Solana vừa được Relayer tài trợ
 * @param extraData Các dữ liệu đi kèm tùy chọn
 * @param apiBaseUrl URL gốc của API
 */
export async function syncMintSuccess(
  walletAddress: string,
  signature: string,
  extraData?: Omit<OnboardingExtraData, 'signature'>,
  apiBaseUrl = ''
): Promise<OnboardingSyncResult> {
  return updateUserOnboardingStatus(
    walletAddress,
    'minted',
    {
      ...extraData,
      signature,
    },
    apiBaseUrl
  );
}
