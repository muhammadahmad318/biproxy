'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { intakeService } from '../../services/intakeService';
import { ConnectionCard } from '../../components/meeting/ConnectionCard';

/**
 * Static Landing Route: /intake
 */
export default function IntakeLandingPage() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartSession = async () => {
        setIsCreating(true);
        setError(null);

        try {
            const response = await intakeService.createSession();
            const session = response.data ? response.data : response;
            router.push(`/intake/${session.id}`);
        } catch (err) {
            console.error('Failed to create session', err);
            setError('Failed to initialize the secure consultation room. Please try again.');
            setIsCreating(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col p-4 md:p-6 overflow-hidden">
            {/* Shared Header Layout */}
            <header className="flex items-center justify-between px-2 py-2 mb-4 z-10">
                <div>
                    <h1 className="text-sm font-semibold tracking-tight text-neutral-200">
                        DEVPROXY AI • Virtual Intake Room
                    </h1>
                    <p className="text-xs text-neutral-500">Discovery Call</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neutral-600" />
                    <span className="text-xs text-neutral-400 capitalize">idle</span>
                </div>
            </header>

            {/* Shared Grid Layout */}
            <section className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full mb-20">
                <ConnectionCard
                    title="Initialize Consultation"
                    description="Initiate a new AI-powered technical discovery call. A secure session will be generated to discuss your project scope."
                    buttonText="Start Consultation"
                    isLoading={isCreating}
                    error={error}
                    onAction={handleStartSession}
                />
            </section>
        </main>
    );
}