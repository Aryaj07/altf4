import PreorderModuleService from "../modules/preorder/service"

export type IPreorderModuleService = InstanceType<typeof PreorderModuleService>

declare module "@medusajs/framework/types" {
  interface ModuleImplementations {
    preorder: IPreorderModuleService
  }
}
