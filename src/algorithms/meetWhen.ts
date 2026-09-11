export type BusySlot = {
  startTime: string;
  endTime: string;
};

export type MemberSchedule = {
  userId: string;
  name: string;
  busySlots: BusySlot[];
};

export type MeetingSlot = {
  startTime: string;
  endTime: string;
  availableMembers: string[];
  unavailableMembers: string[];
  attendancePercentage: number;
};

type Interval = {
  start: number;
  end: number;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

function mergeBusyIntervals(
  busySlots: BusySlot[]
): Interval[] {
  const intervals = busySlots
    .map((slot) => ({
      start: timeToMinutes(slot.startTime),
      end: timeToMinutes(slot.endTime),
    }))
    .filter((slot) => slot.end > slot.start)
    .sort((a, b) => a.start - b.start);

  if (intervals.length === 0) {
    return [];
  }

  const merged: Interval[] = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const previous = merged[merged.length - 1];

    if (current.start <= previous.end) {
      previous.end = Math.max(
        previous.end,
        current.end
      );
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function isAvailable(
  busyIntervals: Interval[],
  start: number,
  end: number
): boolean {
  return !busyIntervals.some(
    (busy) =>
      start < busy.end &&
      end > busy.start
  );
}

export function findMeetingSlots(
  schedules: MemberSchedule[],
  searchStart: string,
  searchEnd: string,
  durationMinutes: number
): MeetingSlot[] {
  const startMinutes = timeToMinutes(searchStart);
  const endMinutes = timeToMinutes(searchEnd);

  if (
    durationMinutes <= 0 ||
    endMinutes <= startMinutes ||
    schedules.length === 0
  ) {
    return [];
  }

  const mergedSchedules = schedules.map(
    (schedule) => ({
      ...schedule,
      mergedBusySlots: mergeBusyIntervals(
        schedule.busySlots
      ),
    })
  );

  const results: MeetingSlot[] = [];

  for (
    let start = startMinutes;
    start + durationMinutes <= endMinutes;
    start += 30
  ) {
    const end = start + durationMinutes;

    const availableMembers: string[] = [];
    const unavailableMembers: string[] = [];

    for (const member of mergedSchedules) {
      const available = isAvailable(
        member.mergedBusySlots,
        start,
        end
      );

      if (available) {
        availableMembers.push(member.name);
      } else {
        unavailableMembers.push(member.name);
      }
    }

    const attendancePercentage =
      (availableMembers.length /
        schedules.length) *
      100;

    results.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      availableMembers,
      unavailableMembers,
      attendancePercentage,
    });
  }

  return results.sort((a, b) => {
    if (
      b.attendancePercentage !==
      a.attendancePercentage
    ) {
      return (
        b.attendancePercentage -
        a.attendancePercentage
      );
    }

    return (
      timeToMinutes(a.startTime) -
      timeToMinutes(b.startTime)
    );
  });
}