import { ManagementProvider } from "db"

export type ManagementError = ManagementMismatchError | GenericOperationalError

export type GenericOperationalError = {
  tag: "GenericOperationalError"
  error: {
    tag: string
    [key: string]: unknown
  }
}

export type ReportOrderFailedError = {
  tag: "ReportOrderFailedError"
  error: unknown
}

export type ManagementMismatchError = {
  tag: "ManagementMismatchError"
  needed: ManagementProvider
  given: ManagementProvider
}

export const genericOperationalError = <Err extends { tag: string }>(
  error: Err
): GenericOperationalError => ({
  tag: "GenericOperationalError",
  error,
})

export const managementMismatchError =
  (needed: ManagementProvider) =>
  (given: ManagementProvider): ManagementMismatchError => ({
    tag: "ManagementMismatchError",
    needed,
    given,
  })
