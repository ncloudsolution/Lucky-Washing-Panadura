"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { IoCloudUploadOutline } from "react-icons/io5";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useWatch } from "react-hook-form";
import OptimizedImage from "../other/OptimizedImage";
import { CentralHKInterface } from "@/utils/common";

interface ISingleImageInput extends CentralHKInterface {
  height?: number; // Optional height
  specialTag?: string;
}

interface FilePreview {
  name: string;
  url: string;
}

const SingleImageInput: React.FC<ISingleImageInput> = ({
  control,
  fieldName,
  labelName,
  height,
  specialTag,
}) => {
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const file = useWatch({ control, name: fieldName });

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setFilePreview({ name: file.name, url });

      return () => URL.revokeObjectURL(url); // Clean up
    }
  }, [file]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    onChange: (file: File) => void
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const labelParts = specialTag ? labelName.split(specialTag) : [labelName];

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-semibold text-[12px] xxs:text-[14px]">
            {labelParts.map((part, index) => (
              <span key={index}>
                {part}
                {/* Add bold styling only if we're not at the last part and `specialTag` exists */}
                {index < labelParts.length - 1 && specialTag && (
                  <span className="font-semibold text-[10px] leading-[10px] text-black bg-gray-200 px-2 py-1 mx-1 rounded-sm">
                    {specialTag}
                  </span>
                )}
              </span>
            ))}
          </FormLabel>
          <div
            tabIndex={0}
            onClick={() =>
              document.getElementById(`fileInput-${fieldName}`)?.click()
            }
            onDrop={(e) => handleDrop(e, field.onChange)}
            onDragOver={handleDragOver}
            style={height ? { height } : undefined}
            className={`relative border border-input bg-transparent rounded-sm text-center cursor-pointer flex items-center justify-center p-1 focus:border-superbase focus:outline-none transition-colors duration-200 ${
              height ? "w-full" : "aspect-square w-full"
            }`}
          >
            <FormControl>
              <Input
                id={`fileInput-${fieldName}`}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, field.onChange)}
              />
            </FormControl>

            {filePreview ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden rounded-sm">
                {/* <Image
                  src={filePreview.url}
                  alt={filePreview.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="100vw"
                /> */}
                <OptimizedImage src={filePreview.url} />
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-center justify-center">
                <IoCloudUploadOutline className="text-[30px] text-muted-foreground/50" />
                <p className="text-[12px] text-muted-foreground">
                  Click or drag an image to upload
                </p>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default SingleImageInput;
