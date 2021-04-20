// GraphQL Utility Fns
export const toDateInt = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
}