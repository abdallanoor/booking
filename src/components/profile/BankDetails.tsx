"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bankDetailsSchema,
  type BankDetailsInput,
} from "@/lib/validations/payout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BankDetails as IBankDetails } from "@/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Comprehensive Egyptian Banks List (Paymob & Standard)
const PAYMOB_BANKS = [
  // Popular Banks
  { code: "NBE", name: "National Bank of Egypt - البنك الأهلي المصري" },
  { code: "MISR", name: "Banque Misr - بنك مصر" },
  { code: "CIB", name: "CIB - البنك التجاري الدولي" },
  { code: "BDC", name: "Banque Du Caire - بنك القاهرة" },
  { code: "QNB", name: "QNB Alahli - بنك قطر الوطني" },
  { code: "HSBC", name: "HSBC - إتش إس بي سي" },
  { code: "BOA", name: "Alex Bank - بنك الإسكندرية" },

  // Other Banks
  { code: "AAIB", name: "Arab African Int. Bank - البنك العربي الأفريقي" },
  { code: "ABK", name: "Al Ahli Bank of Kuwait - البنك الأهلي الكويتي" },
  { code: "ABC", name: "Bank ABC - بنك المؤسسة العربية المصرفية" },
  { code: "ABRK", name: "Al Baraka Bank - بنك البركة" },
  { code: "ADCB", name: "ADCB Egypt - بنك أبوظبي التجاري" },
  { code: "ADIB", name: "ADIB Egypt - مصرف أبوظبي الإسلامي" },
  { code: "AIB", name: "AiBANK - بنك الاستثمار العربي" },
  { code: "ARIB", name: "Arab Int. Bank - المصرف العربي الدولي" },
  { code: "ARAB", name: "Arab Bank - البنك العربي" },
  { code: "AUB", name: "Ahli United Bank - البنك الأهلي المتحد" },
  { code: "BBE", name: "Attijariwafa Bank - التجاري وفا بنك" },
  { code: "BLOM", name: "Blom Bank - بنك بلوم" },
  { code: "CAE", name: "Crédit Agricole - كريدي أجريكول" },
  { code: "CBE", name: "Central Bank of Egypt - البنك المركزي المصري" },
  { code: "EALB", name: "Egyptian Arab Land Bank - البنك العقاري المصري" },
  { code: "EDBE", name: "EBank - البنك المصري لتنمية الصادرات" },
  { code: "EGB", name: "EGBank - البنك المصري الخليجي" },
  { code: "ENBD", name: "Emirates NBD - بنك الإمارات دبي الوطني" },
  { code: "FAB", name: "FABMISR - بنك أبوظبي الأول" },
  { code: "FAIB", name: "Faisal Islamic Bank - بنك فيصل الإسلامي" },
  { code: "GASC", name: "GASC - هيئة السلع التموينية" },
  { code: "HDB", name: "Housing & Dev. Bank - بنك التعمير والإسكان" },
  { code: "IDB", name: "Industrial Dev. Bank - بنك التنمية الصناعية" },
  { code: "MASH", name: "Mashreq - المشرق" },
  { code: "MIDB", name: "MIDBANK - ميد بنك" },
  { code: "NBG", name: "NBG Egypt - البنك الأهلي اليوناني" },
  { code: "NBK", name: "NBK Egypt - بنك الكويت الوطني" },
  { code: "NSB", name: "Nasser Social Bank - بنك ناصر الاجتماعي" },
  { code: "PDAC", name: "Agricultural Bank - البنك الزراعي المصري" },
  { code: "POST", name: "Egypt Post - البريد المصري" },
  { code: "SAIB", name: "saib - بنك الشركة المصرفية العربية الدولية" },
  { code: "SCB", name: "Suez Canal Bank - بنك قناة السويس" },
  { code: "UB", name: "The United Bank - المصرف المتحد" },
];

interface BankDetailsProps {
  bankDetails?: IBankDetails;
  refreshUser: () => Promise<void>;
}

export function BankDetails({ bankDetails, refreshUser }: BankDetailsProps) {
  const t = useTranslations("bank_details");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  const form = useForm<BankDetailsInput>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankCode: bankDetails?.bankCode || "",
      fullName: bankDetails?.fullName || "",
      accountNumber: bankDetails?.accountNumber || "",
      iban: bankDetails?.iban || "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    trigger,
  } = form;

  const onSubmit = async (values: BankDetailsInput) => {
    try {
      const res = await fetch("/api/user/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t("save_failed"));
      }

      toast.success(t("save_success"));
      await refreshUser();
      setIsEditing(false);
      reset(values);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : t("unexpected_error"),
      );
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/user/bank-details", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(t("delete_failed"));

      toast.success(t("delete_success"));
      await refreshUser();
      setIsEditing(false);
      reset({
        bankCode: "",
        fullName: "",
        accountNumber: "",
        iban: "",
      });
    } catch (error) {
      console.error(error);
      toast.error(t("delete_failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!bankDetails?.fullName && !isEditing) {
    return (
      <div className="p-6 md:p-10 border-t border-border mt-8">
        <div className="flex items-start justify-between mb-8">
          <div className="text-start">
            <h3 className="text-lg font-semibold text-foreground">
              {t("title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("no_details_desc")}
            </p>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            variant="secondary"
            className="max-sm:size-9"
          >
            <Plus />
            <span className="max-sm:hidden">{t("add_details")}</span>
          </Button>
        </div>

        <div className="text-center py-12 px-4 border-2 border-dashed rounded-2xl bg-muted/30">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="p-4 bg-muted rounded-full">
              <Landmark className="h-8 w-8 opacity-80" />
            </div>
            <p className="font-medium text-foreground">{t("no_details")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 border-t border-border mt-8">
      <div className="flex items-start justify-between mb-8">
        <div className="text-start">
          <h3 className="text-lg font-semibold text-foreground">
            {t("title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("has_details_desc")}
          </p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Pencil />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsDeleting(true)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              reset();
            }}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
        )}
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="grid gap-6">
            <div className="space-y-2 flex flex-col text-start">
              <Label htmlFor="bankCode">{t("bank_name")}</Label>
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className={cn(
                          "w-full justify-between px-3 h-12",
                          "grid grid-cols-[1fr_20px] gap-2 items-center", // Grid layout for strict width
                          !field.value && "text-muted-foreground",
                          errors.bankCode && "border-destructive",
                        )}
                      >
                        <span className="truncate text-start font-normal">
                          {field.value
                            ? PAYMOB_BANKS.find(
                                (bank) => bank.code === field.value,
                              )?.name
                            : t("select_bank")}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 justify-self-end" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 overflow-hidden text-start">
                      <Command>
                        <CommandInput placeholder={t("search_bank")} />
                        <CommandList>
                          <CommandEmpty>{t("no_bank_found")}</CommandEmpty>
                          <CommandGroup>
                            {PAYMOB_BANKS.map((bank) => (
                              <CommandItem
                                key={bank.code}
                                value={bank.name} // Search by name
                                onSelect={() => {
                                  setValue("bankCode", bank.code);
                                  trigger("bankCode"); // Trigger validation
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "me-2 h-4 w-4",
                                    bank.code === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {bank.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.bankCode && (
                <p className="text-xs text-destructive font-medium">
                  {errors.bankCode.message}
                </p>
              )}
            </div>

            <div className="space-y-2 text-start">
              <Label htmlFor="fullName">{t("full_name")}</Label>
              <Controller
                control={control}
                name="fullName"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="fullName"
                    placeholder={t("name_placeholder")}
                    className={cn(errors.fullName && "border-destructive")}
                  />
                )}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive font-medium">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2 text-start">
              <Label htmlFor="accountNumber">{t("account_number")}</Label>
              <Controller
                control={control}
                name="accountNumber"
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="accountNumber"
                    placeholder={t("acc_placeholder")}
                    className={cn(
                      "text-start",
                      errors.accountNumber && "border-destructive",
                    )}
                  />
                )}
              />
              {errors.accountNumber && (
                <p className="text-xs text-destructive font-medium">
                  {errors.accountNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2 text-start">
              <Label htmlFor="iban">{t("iban")}</Label>
              <Controller
                control={control}
                name="iban"
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="iban"
                    placeholder={t("iban_placeholder")}
                    className={cn(
                      "text-start uppercase",
                      errors.iban && "border-destructive",
                    )}
                  />
                )}
              />
              {errors.iban && (
                <p className="text-xs text-destructive font-medium">
                  {errors.iban.message}
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-start">
              {t("info_text")}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="border rounded-2xl p-6 bg-card space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm text-start">
            <div>
              <p className="text-muted-foreground mb-1">{t("bank_name")}</p>
              <p className="font-medium">
                {PAYMOB_BANKS.find((b) => b.code === bankDetails?.bankCode)
                  ?.name || bankDetails?.bankCode}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">
                {t("account_holder")}
              </p>
              <p className="font-medium">{bankDetails?.fullName}</p>
            </div>
            {bankDetails?.accountNumber && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">
                  {t("account_number")}
                </p>
                <p className="font-mono bg-muted/50 p-2 rounded text-sm text-start select-all">
                  {bankDetails.accountNumber}
                </p>
              </div>
            )}
            {bankDetails?.iban && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">{t("iban")}</p>
                <p className="font-mono bg-muted/50 p-2 rounded text-sm text-start break-all select-all uppercase">
                  {bankDetails.iban}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle>{t("remove_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("remove_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
