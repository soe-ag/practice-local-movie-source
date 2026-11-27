import { getSavedList } from "~/server/utils/savedLists";

export default defineEventHandler((event) => getSavedList(event, "watchList"));
