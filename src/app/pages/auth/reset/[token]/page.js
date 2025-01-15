
'use client';


import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useForgotPasswordStore from '../../../../../pages/zustand/forgotStore';

const ResetPassword = () => {
    const { resetToken, setResetToken, newPassword, setNewPassword, confirmPassword, setConfirmPassword, setIsLoading, message, setMessage } = useForgotPasswordStore();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // Get the reset token from the URL query params
        const token = searchParams.get('token');
        if (token) {
            setResetToken(token);
        } else {
            setMessage('Invalid or expired reset token.');
            router.push('/forgot-password');
        }
    }, [searchParams, setResetToken, setMessage, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetToken, password: newPassword }),
        });

        const data = await res.json();
        setMessage(data.message);

        if (res.ok) {
            router.push("/signin");
        }

        setIsLoading(false);
    };

    return (
        <div>
            <h1>Reset Password</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="password">New Password</label>
                    <input
                        type="password"
                        id="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ResetPassword;
