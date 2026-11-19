const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateOnly = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export function formatDateTime(value: string | null | undefined, fallback = "-") {
  return value ? dateTime.format(new Date(value)) : fallback;
}

export function formatDate(value: string | null | undefined, fallback = "-") {
  return value ? dateOnly.format(new Date(value)) : fallback;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
