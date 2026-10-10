import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionPanelContent,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { SectionHeader } from "~/features/product/components/section-header";
import { useStorefrontData } from "~/features/product/hooks/use-storefront-data";

export function FaqSection() {
  const { faqs } = useStorefrontData();

  return (
    <section
      aria-label="Pertanyaan umum"
      className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"
    >
      <SectionHeader eyebrow="Bantuan" title="Pertanyaan Umum (FAQ)" />
      <div className="grid gap-6 lg:grid-cols-2">
        {[faqs.slice(0, 2), faqs.slice(2)].map((group, gi) => (
          <Accordion key={gi} defaultValue={gi === 0 ? ["faq-0"] : undefined}>
            {group.map((faq, i) => (
              <AccordionItem key={faq.question} value={`faq-${gi * 2 + i}`}>
                <AccordionHeader>
                  <AccordionTrigger>
                    {faq.question}
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 transition-transform"
                    />
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionPanel>
                  <AccordionPanelContent>{faq.answer}</AccordionPanelContent>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
      </div>
    </section>
  );
}
