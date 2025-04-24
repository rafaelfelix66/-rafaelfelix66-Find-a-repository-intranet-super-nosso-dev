
import React from "react";
import { useFiles } from "@/contexts/FileContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const FileBreadcrumb = () => {
  const { currentPath, navigateToBreadcrumb } = useFiles();
  
  return (
    <Breadcrumb>
      {currentPath.map((path, index) => (
        <BreadcrumbItem key={index}>
          <BreadcrumbLink 
            onClick={() => navigateToBreadcrumb(index)}
            className="cursor-pointer"
          >
            {path}
          </BreadcrumbLink>
          {index < currentPath.length - 1 && <BreadcrumbSeparator />}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};
