'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@innozverse/api-client';
import styles from './callback.module.css';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the full URL with query parameters
        const url = window.location.href;

        // Parse OAuth callback parameters
        const result = apiClient.handleOAuthCallback(url);

        if (!result) {
          setError('Invalid OAuth callback. Missing required parameters.');
          setProcessing(false);
          return;
        }

        const { isNewUser } = result;

        // Tokens are already stored by handleOAuthCallback
        console.log('OAuth login successful', { isNewUser });

        // Redirect to home (full reload to update auth state)
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process OAuth callback');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {processing && !error && (
          <>
            <div className={styles.spinner}></div>
            <h2 className={styles.title}>Completing sign in...</h2>
            <p className={styles.message}>
              Please wait while we securely authenticate your account.
            </p>
          </>
        )}

        {error && (
          <>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className={styles.title}>Authentication Failed</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button
              onClick={() => router.push('/login')}
              className={styles.backButton}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
