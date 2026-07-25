import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, PlusCircle, Clock, Trophy } from "lucide-react";

const features = [
  {
    icon: PlusCircle,
    title: "Log Your Bets",
    description:
      "Quickly add MLB bets with game details, odds, wager amount, and pick type.",
  },
  {
    icon: Clock,
    title: "Track Pending Bets",
    description:
      "View all open bets in one place. Mark them as Win, Loss, or Push when results come in.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Overview",
    description:
      "See your totals, win rate, and recent activity at a glance.",
  },
  {
    icon: Trophy,
    title: "Admin Stats",
    description:
      "Get a comprehensive view of all bets, profit/loss, and performance metrics.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
            <BarChart3 className="h-4 w-4" />
            MLB Bet Tracker
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Track Your MLB Bets<br />
            <span className="text-blue-600">with Confidence</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            A lean, fast tool to log your baseball bets, track outcomes, and
            analyze your performance — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/add-bet">
              <Button size="lg" className="w-full sm:w-auto">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Bet
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 w-full">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Start Tracking?</h2>
          <p className="text-blue-100 mb-6">
            Log your first bet and take control of your MLB betting record.
          </p>
          <Link href="/add-bet">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-blue-600 hover:bg-white hover:text-blue-600"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
