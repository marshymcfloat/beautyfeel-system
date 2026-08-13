type HoursRule = { weekday: number; startMinute: number; endMinute: number };

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function timeLabel(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
  const displayHour = hour === 0 || hour === 24 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${suffix}`;
}

export function formatBusinessHours(rules: HoursRule[]) {
  const signatures = dayNames.map((_, index) => rules
    .filter((rule) => rule.weekday === index + 1)
    .map((rule) => `${timeLabel(rule.startMinute)}–${timeLabel(rule.endMinute)}`)
    .join(", "));
  const groups: { start: number; end: number; hours: string }[] = [];
  signatures.forEach((hours, index) => {
    const previous = groups.at(-1);
    if (previous?.hours === hours) previous.end = index;
    else groups.push({ start: index, end: index, hours });
  });
  return groups.map((group) => ({
    days: group.start === group.end ? dayNames[group.start] : `${dayNames[group.start]}–${dayNames[group.end]}`,
    hours: group.hours || "Closed",
  }));
}
