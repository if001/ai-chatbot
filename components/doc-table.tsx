import { Table } from "@radix-ui/themes";
import { Resources } from "@/lib/db/schema";

export default function DocTable({ docs }: { docs: Array<Resources> }) {
  return (
    <>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>FileName</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Summary</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {docs.map((v) => {
            return (
              <>
                <Table.Row>
                  <Table.RowHeaderCell>{v.name}</Table.RowHeaderCell>
                  <Table.Cell>{"tmp"}</Table.Cell>
                </Table.Row>
              </>
            );
          })}
        </Table.Body>
      </Table.Root>
    </>
  );
}
