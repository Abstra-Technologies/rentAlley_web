"use client";

import Link from "next/link";
import {
    BuildingOffice2Icon,
    HomeIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    BoltIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightIcon,
    Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function HowItWorks() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
            {/* HERO */}
            <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-12 lg:pt-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <p className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 w-fit mb-4">
                            <BoltIcon className="w-4 h-4 mr-2" />
                            Simple • Fast • Transparent
                        </p>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
                            How Upkyp works
                        </h1>

                        <p className="mt-4 text-lg text-gray-600 max-w-xl">
                            Manage your rental properties, communicate with tenants, and
                            automate billing — all from one simple dashboard. Here’s the
                            step-by-step flow for landlords and tenants.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <Link
                                href="/pages/auth/selectRole"
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold shadow hover:shadow-lg"
                            >
                                Get started
                                <ArrowRightIcon className="w-4 h-4" />
                            </Link>

                            <Link
                                href="/pages/public/support"
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Contact sales
                            </Link>
                        </div>
                    </div>

                    <div className="order-first lg:order-last">
                        {/* Illustration / cards */}
                        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-6 rounded-2xl shadow-md">
                            <div className="grid grid-cols-2 gap-4">
                                <FeatureCard
                                    icon={<BuildingOffice2Icon className="w-6 h-6" />}
                                    title="List your property"
                                    desc="Add photos, unit details, rent and availability in minutes."
                                />
                                <FeatureCard
                                    icon={<DocumentTextIcon className="w-6 h-6" />}
                                    title="Create lease agreement"
                                    desc="Generate & sign digital lease agreements and store them securely."
                                />
                                <FeatureCard
                                    icon={<CurrencyDollarIcon className="w-6 h-6" />}
                                    title="Automated billing"
                                    desc="Monthly bills generated automatically with optional submetering."
                                />
                                <FeatureCard
                                    icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
                                    title="Built-in messaging"
                                    desc="Communicate with tenants, send announcements and maintenance requests."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4-step Flow */}
            <section className="max-w-6xl mx-auto px-6 sm:px-8 mt-14">
                <h2 className="text-2xl font-bold text-gray-900">Simple 4-step flow</h2>
                <p className="mt-2 text-gray-600 max-w-2xl">
                    Whether you’re a landlord or a tenant, UPKYP is designed to remove
                    friction. Here’s the typical journey.
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Step
                        step="1"
                        title="Create an account"
                        desc="Sign up as a landlord or tenant. Landlords can create properties and invite tenants."
                        icon={<Cog6ToothIcon className="w-6 h-6" />}
                    />
                    <Step
                        step="2"
                        title="List & manage units"
                        desc="Add unit descriptions, photos, amenities and rental terms."
                        icon={<HomeIcon className="w-6 h-6" />}
                    />
                    <Step
                        step="3"
                        title="Automate billing"
                        desc="Set up property billing preferences — submetered or consolidated — and UPKYP will generate monthly bills."
                        icon={<CurrencyDollarIcon className="w-6 h-6" />}
                    />
                    <Step
                        step="4"
                        title="Manage occupancy"
                        desc="Accept applicants, sign lease agreements, collect payments, and handle maintenance requests."
                        icon={<DocumentTextIcon className="w-6 h-6" />}
                    />
                </div>
            </section>

            {/* Key Features */}
            <section className="max-w-7xl mx-auto px-6 sm:px-8 mt-16">
                <div className="bg-white p-8 rounded-2xl shadow border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">What you get</h3>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureListItem
                            title="Smart Billing"
                            text="Flexible billing modes for submetered or included utilities, auto-reminders and multiple payment methods."
                        />
                        <FeatureListItem
                            title="Tenant Portal"
                            text="Tenants can view bills, submit payments, and open maintenance tickets — all in one place."
                        />
                        <FeatureListItem
                            title="Property Analytics"
                            text="See page views, inquiries and engagement so you can optimize your listings."
                        />
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="max-w-4xl mx-auto px-6 sm:px-8 mt-12">
                <h3 className="text-lg font-semibold text-gray-900">Common questions</h3>
                <div className="mt-4 space-y-3">
                    <FaqItem
                        q="Can I charge utilities based on submeter readings?"
                        a="Yes — UPKYP supports submetered utilities and also provider/included billing types. You can set property-level rates or let tenants pay based on submeter readings."
                    />
                    <FaqItem
                        q="How do tenants pay rent?"
                        a="Tenants can pay using the payment methods you enable (bank transfer, e-wallets, etc.). A receipt and ledger are recorded automatically."
                    />
                    <FaqItem
                        q="Can I invite multiple landlords/team members?"
                        a="Yes — properties can be managed by multiple users depending on your plan."
                    />
                </div>
            </section>

            {/* CTA Footer */}
            <section className="max-w-7xl mx-auto px-6 sm:px-8 mt-12">
                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <h4 className="text-2xl font-bold">Ready to simplify property management?</h4>
                        <p className="mt-2 text-white/90">Start for free — list a property and see the magic.</p>
                    </div>

                    <div className="flex gap-3 items-center">
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-blue-700 font-semibold shadow"
                        >
                            Create free account
                            <ArrowRightIcon className="w-4 h-4" />
                        </Link>

                        <Link
                            href="/pricing"
                            className="px-4 py-3 rounded-lg border border-white/30 text-white font-medium hover:bg-white/10"
                        >
                            View plans
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="max-w-7xl mx-auto px-6 sm:px-8 mt-12 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} UPKYP — Built for busy landlords & happy tenants.
            </footer>
        </main>
    );
}

/* ---------- small UI components ---------- */

function FeatureCard({
                         icon,
                         title,
                         desc,
                     }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">{icon}</div>
            <div>
                <h4 className="font-semibold text-gray-800">{title}</h4>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
        </div>
    );
}

function Step({
                  step,
                  title,
                  desc,
                  icon,
              }: {
    step: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold">
                    {step}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className="text-blue-600">{icon}</div>
                        <h5 className="font-semibold text-gray-900">{title}</h5>
                    </div>
                </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">{desc}</p>
        </div>
    );
}

function FeatureListItem({ title, text }: { title: string; text: string }) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h6 className="font-semibold text-gray-800">{title}</h6>
            <p className="text-sm text-gray-600 mt-2">{text}</p>
        </div>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    return (
        <details className="bg-white border border-gray-100 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-900">{q}</summary>
            <p className="mt-2 text-sm text-gray-600">{a}</p>
        </details>
    );
}
