export default function AdminKyc() {
  const queue = [
    { id: "kyc-104", user: "user-104", step: "Selfie", submitted: "10:31" },
    { id: "kyc-332", user: "user-332", step: "ID document", submitted: "11:02" },
    { id: "kyc-821", user: "user-821", step: "Phone",     submitted: "10:44" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-semibold">KYC queue</h1>
      <p className="text-muted text-sm mt-1">86 documents awaiting review.</p>
      <div className="mt-5 rounded-md border border-line bg-bg-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-800 text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Request</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Step</th>
              <th className="text-right px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {queue.map(q => (
              <tr key={q.id}>
                <td className="px-4 py-3 font-mono text-xs">{q.id}</td>
                <td className="px-4 py-3">{q.user}</td>
                <td className="px-4 py-3">{q.step}</td>
                <td className="px-4 py-3 text-right text-muted">{q.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
