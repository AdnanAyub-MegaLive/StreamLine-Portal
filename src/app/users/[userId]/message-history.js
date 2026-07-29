"use client";

import { useMemo, useState } from "react";

export default function MessageHistory({ records }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return records;
    return records.filter((record) =>
      [
        record.body,
        record.title,
        record.sender,
        record.conversation,
        record.messageId,
        record.type,
        record.direction,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [query, records]);

  return (
    <section className="mt-8 rounded-2xl border border-[#dce8e5] bg-white p-5 shadow-[0_8px_25px_rgba(17,61,57,.04)] md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#16877d] uppercase">
            Private admin view
          </p>
          <h2 className="mt-1 text-lg font-bold">Messaging history</h2>
          <p className="mt-1 text-xs text-[#748782]">
            Direct messages, World Chat activity, and system notifications
            associated with this user.
          </p>
        </div>
        <label className="block w-full md:max-w-sm">
          <span className="sr-only">Search message history</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search words, sender, chat, or message ID"
            className="h-11 w-full rounded-xl border border-[#cededb] bg-[#f8fbfa] px-4 text-xs outline-none focus:border-[#2ca89c] focus:ring-2 focus:ring-[#2ca89c]/10"
          />
        </label>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-[#e1ebe9]">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="bg-[#f3f8f7] text-[10px] tracking-wider text-[#657a75] uppercase">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Conversation</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2f1]">
            {filtered.map((record) => (
              <tr key={`${record.type}-${record.messageId}`}>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[#e7f5f2] px-2.5 py-1 text-[9px] font-bold text-[#087f74]">
                    {record.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {record.conversation}
                  <p className="mt-1 text-[9px] font-normal text-[#81928e]">
                    {record.messageId}
                  </p>
                </td>
                <td className="px-4 py-3">{record.sender}</td>
                <td className="max-w-md px-4 py-3">
                  <p className="whitespace-pre-wrap text-[#334d49]">
                    {record.title && (
                      <strong className="mb-1 block">{record.title}</strong>
                    )}
                    {record.body}
                  </p>
                </td>
                <td className="px-4 py-3">{record.direction}</td>
                <td className="px-4 py-3 text-[#71847f]">{record.createdAt}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan="6"
                  className="px-5 py-14 text-center text-[#7d908b]"
                >
                  {query
                    ? "No messaging records match those words."
                    : "No messaging history has been stored for this user yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-[#81928e]">
        Showing {filtered.length} of {records.length} most recent stored
        records.
      </p>
    </section>
  );
}
