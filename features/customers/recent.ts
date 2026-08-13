export type RecentCustomer = {
  name: string;
  phoneE164: string;
  lastBookedAt: string;
};

export function filterRecentCustomers(customers: RecentCustomer[], query: string, limit = 6) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return customers.slice(0, limit);
  const phoneTerm = term.replace(/\D/g, "");
  const normalizedPhoneTerm = phoneTerm.startsWith("0") ? `63${phoneTerm.slice(1)}` : phoneTerm;
  return customers
    .filter((customer) =>
      customer.name.toLocaleLowerCase().includes(term)
      || (normalizedPhoneTerm.length > 0 && customer.phoneE164.replace(/\D/g, "").includes(normalizedPhoneTerm)),
    )
    .slice(0, limit);
}
