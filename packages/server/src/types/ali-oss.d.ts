declare module "ali-oss" {
  interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
  }

  interface PutResult {
    url: string;
    name: string;
  }

  interface PutOptions {
    mime?: string;
  }

  class OSS {
    constructor(options: OSSOptions);
    put(name: string, file: Buffer, options?: PutOptions): Promise<PutResult>;
  }

  export = OSS;
}
