//src/pages/FileStorage.tsx
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileProvider } from "@/contexts/FileContext";
import { FileHeader } from "@/components/file-storage/FileHeader";
import { FileBreadcrumb } from "@/components/file-storage/FileBreadcrumb";
import { FileGrid } from "@/components/file-storage/FileGrid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const FileStorage = () => {
  return (
    <Layout>
      <FileProvider>
        <div className="space-y-6">
          <FileHeader />
          
                  
          <Card>
            <CardHeader className="pb-3">
              <FileBreadcrumb />
            </CardHeader>
            <CardContent>
              <FileGrid />
            </CardContent>
          </Card>
        </div>
      </FileProvider>
    </Layout>
  );
};

export default FileStorage;