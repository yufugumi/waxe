import { Section, Container } from "../components/craft";
import { ArrowRight } from "lucide-react";
import { Button } from "../src/components/ui/button";
import { Badge } from "../src/components/ui/badge";

import Link from "next/link";

const Hero = () => {
  return (
    <Section className="relative backdrop-blur-sm">
      <Container className="flex flex-col gap-8 rounded-md border bg-muted/50 p-4">
        <Badge className="not-prose w-fit hover:bg-sky-100" variant="outline">
          <Link
            className="group flex items-center gap-1"
            href="https://github.com/et0and/wellington.govt.nz-axe/releases/latest"
          >
            See the latest report
            <ArrowRight className="w-4 transition-all group-hover:-rotate-45" />
          </Link>
        </Badge>
        <h1 className="text-2xl font-medium">
          Wellington.govt.nz accessibility reports
        </h1>
        <p>
          Download and track changes for accessibility issues picked up by Axe.
        </p>
        <p>Currently, the website has <strong>number</strong> of issues.</p>

        <div className="flex gap-4">
          <Button className="hover:bg-blue-600">
            <Link href="https://github.com/et0and/wellington.govt.nz-axe/releases/latest">
              Download latest
            </Link>
          </Button>
          <Button variant="outline" className="hover:bg-sky-100">
            <Link href="https://github.com/et0and/wellington.govt.nz-axe/releases">
              Past reports
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
};

export default Hero;
