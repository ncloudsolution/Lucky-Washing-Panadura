export const StepLine = ({
  stepObject,
  step,
  setStep,
}: {
  stepObject: any[];
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}) => {
  return (
    <div className="flex w-full justify-center xs:gap-5 gap-3 mt-1 xs:text-[14px] text-[12px]">
      {stepObject.map((obj, index) => (
        <div
          key={index}
          className={`${
            step > index
              ? "border-primary"
              : "border-muted-foreground/50 text-muted-foreground/50"
          } border-b-4 font-semibold cursor-pointer py-1 w-fit text-center `}
          // onClick={() => setStep(index + 1)}
        >
          {obj.title}
        </div>
      ))}
    </div>
  );
};
