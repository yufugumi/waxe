import { Section, Container } from "../components/craft";
import { ArrowRight } from "lucide-react";
import { Button } from "../src/components/ui/button";
import { Badge } from "../src/components/ui/badge";

import Link from "next/link";
import { useState, useEffect } from "react";

const Hero = () => {
  const [issueCount, setIssueCount] = useState(0);

  useEffect(() => {
    fetch("/api/countIssues")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setIssueCount(data.count);
      })
      .catch((error) => {
        console.error("Error fetching issue count:", error);
      });
  }, []);

  return (
    <Section className="relative backdrop-blur-sm ">
      <Container className="flex flex-col rounded-md border bg-muted/50 p-4 shadow-xl">
        <h1 className="text-2xl font-semibold">
          Website accessibility reports
        </h1>

        <p>
          Download and track changes for accessibility issues picked up by Axe.
        </p>

          <Link
            href="https://github.com/et0and/wellington.govt.nz-axe/releases/latest"
            className="font-medium py-4 hover:text-blue-600 hover:underline focus:outline-double focus:outline-4"
          >
            Open latest
          </Link>
          <Link
            href="https://github.com/et0and/wellington.govt.nz-axe/releases"
            className="font-medium pb-4 hover:text-blue-600 hover:underline focus:outline-double focus:outline-4"
          >
            Past reports
          </Link>

        <Badge
          className="focus:outline-double not-prose w-fit"
          variant="outline"
        >
          <p className="group flex items-center gap-1">
            Running axed version 0.0.1
          </p>
        </Badge>
      </Container>
    </Section>
  );
};

export default Hero;
