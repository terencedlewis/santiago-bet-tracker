import { Sidebar } from "@/components/Sidebar";
import { AddBetForm } from "@/components/AddBetForm";

export default function AddBetPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Bet</h1>
          <p className="text-sm text-gray-500 mt-1">Record a new MLB bet</p>
        </div>
        <AddBetForm />
      </div>
    </div>
  );
}
