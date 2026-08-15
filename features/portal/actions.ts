"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireActor } from "@/lib/auth/session";
import { portalSectionTags, tagsForPortalSections, type PortalSection } from "@/lib/cache/portal";
import { runAction } from "@/lib/errors/action";

const sectionNames = Object.keys(portalSectionTags) as [PortalSection, ...PortalSection[]];
const refreshSchema = z.object({ sections: z.array(z.enum(sectionNames)).min(1).max(8) });

export async function refreshPortalSections(input: unknown) {
  return runAction(async () => {
    await requireActor(["OWNER", "BOOKING_ASSISTANT"]);
    const { sections } = refreshSchema.parse(input);
    for (const tag of tagsForPortalSections(sections)) updateTag(tag);
    return { sections };
  });
}
