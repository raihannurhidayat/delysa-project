import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

describe("Table", () => {
  it("renders a semantic table wrapped in a horizontally scrollable container", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Buket</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(table.closest("[data-slot=table-container]")).toHaveClass(
      "overflow-x-auto",
    );
    expect(
      screen.getByRole("columnheader", { name: "Nama" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Buket" })).toBeInTheDocument();
  });
});
