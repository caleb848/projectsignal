/**
 * Data access layer.
 *
 * Every page reads data through these functions, never from the raw arrays.
 * To connect a real backend, replace these implementations with API or
 * database calls (and make them async); the rest of the app stays unchanged.
 */
import { activity } from "./activity";
import { allocations, roles } from "./capacity";
import { decisions } from "./decisions";
import { projects } from "./projects";
import { risks } from "./risks";
import { waitingItems } from "./waiting";

export const getProjects = () => projects;
export const getProject = (id: string) => projects.find((p) => p.id === id);
export const getRisks = () => risks;
export const getWaitingItems = () => waitingItems;
export const getDecisions = () => decisions;
export const getActivity = () => [...activity].sort((a, b) => b.at.localeCompare(a.at));
export const getRoles = () => roles;
export const getAllocations = () => allocations;
