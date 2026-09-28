import type { Allocation, Role } from "@/lib/types";

/** Delivery disciplines. Capacity = headcount × productive hours per person. */
export const roles: Role[] = [
  { id: "pm", name: "Project Management", headcount: 5, hoursPerPerson: 30 },
  { id: "strategy", name: "Strategy", headcount: 2, hoursPerPerson: 30 },
  { id: "creative", name: "Creative", headcount: 3, hoursPerPerson: 30 },
  { id: "design", name: "Design", headcount: 4, hoursPerPerson: 30 },
  { id: "copy", name: "Copy", headcount: 3, hoursPerPerson: 30 },
  { id: "video", name: "Video", headcount: 2, hoursPerPerson: 30 },
  { id: "dev", name: "Development", headcount: 3, hoursPerPerson: 30 },
  { id: "media", name: "Media", headcount: 2, hoursPerPerson: 30 },
];

/** Planned hours per project per role for weeks of Oct 5, 12, 19, 26. */
export const allocations: Allocation[] = [
  // Project Management
  { projectId: "summit-brand-campaign", roleId: "pm", hours: [16, 16, 10, 4] },
  { projectId: "northstar-product-launch", roleId: "pm", hours: [14, 14, 14, 14] },
  { projectId: "evergreen-social-campaign", roleId: "pm", hours: [10, 8, 4, 4] },
  { projectId: "atlas-website-relaunch", roleId: "pm", hours: [16, 16, 16, 16] },
  { projectId: "nova-video-production", roleId: "pm", hours: [14, 14, 12, 2] },
  { projectId: "horizon-paid-media-launch", roleId: "pm", hours: [8, 8, 10, 12] },
  { projectId: "beacon-brand-refresh", roleId: "pm", hours: [12, 12, 10, 10] },
  { projectId: "orbit-content-series", roleId: "pm", hours: [10, 12, 12, 10] },
  { projectId: "cedar-landing-page-program", roleId: "pm", hours: [10, 12, 12, 10] },
  { projectId: "peak-event-campaign", roleId: "pm", hours: [10, 10, 10, 12] },
  { projectId: "mosaic-crm-campaign", roleId: "pm", hours: [8, 8, 10, 10] },
  { projectId: "aurora-creative-refresh", roleId: "pm", hours: [6, 6, 8, 10] },
  // Strategy
  { projectId: "aurora-creative-refresh", roleId: "strategy", hours: [12, 12, 8, 4] },
  { projectId: "beacon-brand-refresh", roleId: "strategy", hours: [8, 10, 8, 6] },
  { projectId: "mosaic-crm-campaign", roleId: "strategy", hours: [6, 4, 2, 2] },
  { projectId: "horizon-paid-media-launch", roleId: "strategy", hours: [8, 8, 8, 10] },
  { projectId: "orbit-content-series", roleId: "strategy", hours: [4, 6, 8, 8] },
  // Creative
  { projectId: "summit-brand-campaign", roleId: "creative", hours: [14, 14, 4, 0] },
  { projectId: "aurora-creative-refresh", roleId: "creative", hours: [16, 18, 20, 16] },
  { projectId: "beacon-brand-refresh", roleId: "creative", hours: [12, 14, 12, 10] },
  { projectId: "northstar-product-launch", roleId: "creative", hours: [14, 16, 14, 10] },
  { projectId: "nova-video-production", roleId: "creative", hours: [8, 6, 4, 0] },
  { projectId: "orbit-content-series", roleId: "creative", hours: [6, 6, 8, 10] },
  { projectId: "peak-event-campaign", roleId: "creative", hours: [4, 4, 8, 14] },
  // Design
  { projectId: "beacon-brand-refresh", roleId: "design", hours: [36, 40, 36, 30] },
  { projectId: "aurora-creative-refresh", roleId: "design", hours: [20, 24, 28, 30] },
  { projectId: "northstar-product-launch", roleId: "design", hours: [18, 14, 8, 0] },
  { projectId: "atlas-website-relaunch", roleId: "design", hours: [12, 10, 12, 8] },
  { projectId: "peak-event-campaign", roleId: "design", hours: [12, 14, 12, 6] },
  { projectId: "mosaic-crm-campaign", roleId: "design", hours: [6, 6, 0, 0] },
  { projectId: "orbit-content-series", roleId: "design", hours: [6, 6, 8, 8] },
  // Copy
  { projectId: "atlas-website-relaunch", roleId: "copy", hours: [16, 16, 10, 6] },
  { projectId: "mosaic-crm-campaign", roleId: "copy", hours: [14, 14, 6, 0] },
  { projectId: "evergreen-social-campaign", roleId: "copy", hours: [10, 8, 8, 8] },
  { projectId: "northstar-product-launch", roleId: "copy", hours: [12, 12, 12, 10] },
  { projectId: "orbit-content-series", roleId: "copy", hours: [10, 12, 10, 12] },
  { projectId: "peak-event-campaign", roleId: "copy", hours: [8, 12, 16, 14] },
  // Video
  { projectId: "nova-video-production", roleId: "video", hours: [38, 42, 30, 0] },
  { projectId: "summit-brand-campaign", roleId: "video", hours: [16, 24, 0, 0] },
  { projectId: "northstar-product-launch", roleId: "video", hours: [0, 0, 16, 20] },
  { projectId: "orbit-content-series", roleId: "video", hours: [0, 0, 0, 16] },
  // Development
  { projectId: "atlas-website-relaunch", roleId: "dev", hours: [24, 56, 60, 58] },
  { projectId: "cedar-landing-page-program", roleId: "dev", hours: [8, 34, 20, 0] },
  { projectId: "mosaic-crm-campaign", roleId: "dev", hours: [12, 10, 0, 4] },
  { projectId: "peak-event-campaign", roleId: "dev", hours: [8, 0, 0, 0] },
  { projectId: "horizon-paid-media-launch", roleId: "dev", hours: [6, 6, 4, 0] },
  { projectId: "northstar-product-launch", roleId: "dev", hours: [8, 0, 0, 0] },
  // Media
  { projectId: "summit-brand-campaign", roleId: "media", hours: [18, 22, 0, 0] },
  { projectId: "horizon-paid-media-launch", roleId: "media", hours: [16, 22, 26, 28] },
  { projectId: "evergreen-social-campaign", roleId: "media", hours: [8, 6, 0, 0] },
  { projectId: "peak-event-campaign", roleId: "media", hours: [0, 0, 12, 0] },
  { projectId: "northstar-product-launch", roleId: "media", hours: [0, 0, 0, 10] },
];
