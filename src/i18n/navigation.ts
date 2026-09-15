import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** 로케일이 붙은 Link·router. `next/link` 대신 이걸 쓴다. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
