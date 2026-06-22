import type { Prisma } from "@prisma/client";

const MS_PER_DAY = 86_400_000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Maps segment.definition JSON to a Prisma where clause on User.
 * - No `rule`, empty `rule`, or `rule: "all"` → all users.
 * - `coinBalance` → IntFilter from eq / gt / gte / lt / lte.
 * - `lastOrderDaysAgo` + `gt` | `gte` → no order since cutoff (includes users with no orders).
 */
export function userWhereFromSegmentDefinition(definition: unknown): Prisma.UserWhereInput {
  if (definition === null || definition === undefined) {
    return {};
  }
  if (!isPlainObject(definition)) {
    throw new Error("Segment definition must be a JSON object");
  }

  const ruleRaw = definition.rule;
  const rule = typeof ruleRaw === "string" ? ruleRaw.trim() : undefined;

  if (ruleRaw === undefined || rule === "" || rule === "all") {
    return {};
  }

  if (rule === "coinBalance") {
    const filter: Prisma.IntFilter = {};
    for (const key of ["eq", "gt", "gte", "lt", "lte"] as const) {
      const v = definition[key];
      if (typeof v === "number" && Number.isFinite(v)) {
        if (key === "eq") filter.equals = v;
        if (key === "gt") filter.gt = v;
        if (key === "gte") filter.gte = v;
        if (key === "lt") filter.lt = v;
        if (key === "lte") filter.lte = v;
      }
    }
    if (Object.keys(filter).length === 0) {
      throw new Error('Segment rule "coinBalance" requires at least one of: eq, gt, gte, lt, lte');
    }
    return { coinBalance: filter };
  }

  if (rule === "lastOrderDaysAgo") {
    const gt = typeof definition.gt === "number" ? definition.gt : undefined;
    const gte = typeof definition.gte === "number" ? definition.gte : undefined;
    if (gt === undefined && gte === undefined) {
      throw new Error('Segment rule "lastOrderDaysAgo" requires "gt" or "gte" (days)');
    }
    /** Days for cutoff window: gte N → inactive ≥N days; gt N → inactive ≥N+1 calendar buckets (strict). */
    const dayWindow = gte !== undefined ? gte : (gt as number) + 1;
    const cutoff = new Date(Date.now() - dayWindow * MS_PER_DAY);
    return {
      orders: {
        none: {
          createdAt: { gte: cutoff },
        },
      },
    };
  }

  throw new Error(`Unknown segment rule: "${rule}". Supported: all, coinBalance, lastOrderDaysAgo.`);
}
