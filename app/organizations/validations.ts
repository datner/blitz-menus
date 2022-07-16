import { z } from "zod"
import { Organization } from "db"
import { BaseEntity, IdOrSlug } from "app/core/helpers/zod"

export const OrganizationSchema = BaseEntity.extend({ name: z.string().nonempty() })

export const CreateOrganization = OrganizationSchema.pick({ name: true, identifier: true })
export const UpdateOrganization = CreateOrganization
export const DeleteOrganization = IdOrSlug
