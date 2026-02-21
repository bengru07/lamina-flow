// src/declarations.d.ts
declare module '@cubone/react-file-manager' {
  import { FC } from 'react';

  export interface FileManagerProps {
    files: any[];
    onFileClick?: (file: any) => void;
    // Add other props here as you discover them in the docs
    [key: string]: any; 
  }

  const FileManager: FC<FileManagerProps>;

  export { FileManager };
  export default FileManager;
}