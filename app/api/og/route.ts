import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const unit = searchParams.get('unit') || 'Unit';
        const property = searchParams.get('property') || 'Property';
        const rent = searchParams.get('rent') || '₱0';
        const image = searchParams.get('image') || '';

        return new ImageResponse(
            (
                <div
                    style={{
            height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                position: 'relative',
                padding: '2rem',
        }}
    >
        {/* Background Image */}
        {image && (
            <div
                style={{
            position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.4,
                zIndex: 1,
        }}
            />
        )}

        {/* Gradient Overlay */}
        <div
            style={{
            position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.9) 100%)',
                zIndex: 1,
        }}
        />

        {/* Content */}
        <div
            style={{
            position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: '800px',
                color: 'white',
                padding: '2rem',
        }}
    >
        <div
            style={{
            fontSize: 28,
                marginBottom: '1rem',
                fontWeight: 700,
                opacity: 0.95
        }}
    >
    🏠 Available Now!
        </div>

        <div
        style={{
            fontSize: 52,
                marginBottom: '0.5rem',
                fontWeight: 900,
                lineHeight: 1.2
        }}
    >
        {unit}
        </div>

        <div
        style={{
            fontSize: 32,
                marginBottom: '1.5rem',
                fontWeight: 600,
                opacity: 0.9
        }}
    >
        {property}
        </div>

        <div
        style={{
            fontSize: 72,
                fontWeight: 900,
                background: 'linear-gradient(45deg, white 0%, #f8fafc 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                padding: '1rem 2rem',
                borderRadius: 16,
                marginBottom: '1rem',
                border: '3px solid rgba(255,255,255,0.4)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}
    >
        {rent}
        </div>

        <div
        style={{
            fontSize: 24,
                opacity: 0.9,
                fontWeight: 600
        }}
    >
        Rent with Rent Alley ✨
            </div>
            </div>
            </div>
    ),
        {
            width: 1200,
                height: 630,
            fonts: [
            {
                name: 'Inter',
                data: await fetch(
                    new URL(
                        'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap'
                    )
                ).then((res) => res.text()),
            },
        ],
        }
    );
    } catch (error) {
        console.error('OG Image Error:', error);

        // Fallback OG Image
        return new ImageResponse(
            (
                <div
                    style={{
            height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 900,
        }}
    >
        <div style={{ fontSize: 64, marginBottom: '1rem' }}>
    🏠 Unit Available
        </div>
        <div style={{ fontSize: 48, fontWeight: 700 }}>
        Rent Alley
        </div>
        </div>
    ),
        {
            width: 1200,
                height: 630,
        }
    );
    }
}