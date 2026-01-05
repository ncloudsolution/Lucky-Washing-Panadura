import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { IoCloudUploadOutline } from "react-icons/io5";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Control, useController, useFormContext } from "react-hook-form";

interface ICustomSingleFileInput {
  control: Control<any>;
  fieldName: string;
  labelName: string;
  height?: string;
  filetype?: string;
}

interface FilePreview {
  name: string;
  url: string;
}

const CustomAssetFile: React.FC<ICustomSingleFileInput> = ({
  control,
  fieldName,
  labelName,
  height = "aspect-square",
  filetype = ".zip",
}: ICustomSingleFileInput) => {
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);

  const { field } = useController({
    control,
    name: fieldName,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Update form value and clear any existing error
    field.onChange(file);

    // Update the preview state
    setFilePreview({
      name: file.name,
      url: URL.createObjectURL(file),
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Update form value and clear any existing error
    field.onChange(file);

    // Update the preview state
    setFilePreview({
      name: file.name,
      url: URL.createObjectURL(file),
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <FormField
      control={control}
      name={fieldName}
      render={() => (
        <FormItem className="space-y-1">
          <FormLabel className="font-semibold">{labelName}</FormLabel>
          <div
            onClick={() => document.getElementById("fileInput3")?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative border-[1px] border-dashed bg-gray-50 border-gray-400 rounded-lg p-[18px] text-center cursor-pointer w-full ${height} flex items-center justify-center`}
          >
            <FormControl>
              <Input
                type="file"
                accept={filetype}
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="fileInput3"
              />
            </FormControl>

            {filePreview ? (
              <div className="block break-words w-full h-fit">
                {filePreview.name}
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-center justify-center">
                <IoCloudUploadOutline className="text-[50px]  text-gray-300" />
                <p className="lg:text-[16px] text-[14px]  text-gray-400">
                  Click here or drag a file to upload
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

export default CustomAssetFile;
