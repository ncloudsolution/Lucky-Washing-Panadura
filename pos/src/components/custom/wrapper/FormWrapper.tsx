"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface IWrapper {
  variant: "default" | "dialog" | "headless";
  className?: string;
  cardTitle?: string | React.ReactNode;
  cardDescription?: string | React.ReactNode;
  footerText?: string | React.ReactNode;
  linkText?: string | React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  width?: string;
}

type Variant = "default" | "dialog" | "headless";

interface WrapperConfig {
  className: string;
  showHeader: boolean;
  showFooter: boolean;
}

const getWrapperConfig = (
  variant: Variant,
  className?: string,
  width?: string
): WrapperConfig => {
  const dialogClass = "w-full shadow-none border-none xs:p-0 p-0";

  const defaultClass = `flex flex-col ${
    width ?? "w-full xxs:w-[350px] xs:w-[420px]"
  } h-fit`;

  switch (variant) {
    case "dialog":
      return {
        className: `${dialogClass} ${className}`,
        showHeader: true,
        showFooter: false,
      };
    case "headless":
      return {
        className: `${dialogClass} ${className}`,
        showHeader: false,
        showFooter: false,
      };
    case "default":
    default:
      return {
        className: `${defaultClass} ${className}`,
        showHeader: true,
        showFooter: true,
      };
  }
};

const FormWrapper = ({
  variant = "default",
  className = "",
  cardTitle,
  cardDescription,
  footerText,
  linkText,
  children,
  onClick,
  width,
}: IWrapper) => {
  const {
    className: finalClassName,
    showHeader,
    showFooter,
  } = getWrapperConfig(variant, className, width);

  return (
    <Card className={finalClassName}>
      {showHeader && (cardTitle || cardDescription) && (
        <CardHeader className="flex flex-col items-center">
          {cardTitle && <CardTitle>{cardTitle}</CardTitle>}
          {cardDescription && (
            <CardDescription className="sm:w-[70%] w-[80%] text-center">
              {cardDescription}
            </CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent>{children}</CardContent>

      {showFooter && footerText && (
        <CardFooter className="flex justify-center gap-x-2 text-[14px]">
          <div>{footerText}</div>
          {linkText && (
            <div className="text-primary cursor-pointer" onClick={onClick}>
              {linkText}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default FormWrapper;
