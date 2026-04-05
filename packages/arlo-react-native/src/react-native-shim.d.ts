declare module "react-native" {
  import type { ComponentType } from "react";

  export const Image: ComponentType<any>;
  export const Pressable: ComponentType<any>;
  export const ScrollView: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const TextInput: ComponentType<any>;
  export const View: ComponentType<any>;

  export const StyleSheet: {
    create<T extends Record<string, any>>(styles: T): T;
  };
}
