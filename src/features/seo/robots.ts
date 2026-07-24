import type { RobotsDirective } from "./types";

export function buildPublishedRobots(): RobotsDirective {
  return { index: true, follow: true };
}

export function buildPreviewRobots(): RobotsDirective {
  return {
    index: false,
    follow: false,
    nocache: true,
    noimageindex: true,
  };
}

export function buildUnavailableRobots(): RobotsDirective {
  return { index: false, follow: false };
}

export function buildRobotsDirective(input: {
  isPreview?: boolean;
  robotsIndex: boolean;
}): RobotsDirective {
  if (input.isPreview || !input.robotsIndex) {
    return buildPreviewRobots();
  }
  return buildPublishedRobots();
}
