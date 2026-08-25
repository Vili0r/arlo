import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ComplaintsView } from "@/components/complaints-view";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";

interface ComplaintsPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ComplaintsPage({
  params,
  searchParams,
}: ComplaintsPageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth();
  
  const searchParamsResolved = await searchParams;
  const page = typeof searchParamsResolved.page === "string" ? parseInt(searchParamsResolved.page, 10) : 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Query complaints strictly for this tenant
  const [complaints, totalComplaints] = await Promise.all([
    prisma.complaint.findMany({
      where: {
        orgId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        createdBy: {
          select: { email: true, firstName: true, lastName: true },
        },
        complaintOwner: {
          select: { email: true, firstName: true, lastName: true },
        },
        assignedInvestigator: {
          select: { email: true, firstName: true, lastName: true },
        },
        approvedBy: {
          select: { email: true, firstName: true, lastName: true },
        },
        investigation: {
          include: {
            investigator: {
              select: { email: true, firstName: true, lastName: true },
            },
          },
        },
        vigilanceDecisionTree: true,
        customerCommunications: {
          orderBy: { communicationDate: "desc" },
          include: {
            author: {
              select: { email: true, firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            customerCommunications: true,
          },
        },
      },
    }),
    prisma.complaint.count({
      where: {
        orgId,
        deletedAt: null,
      },
    })
  ]);

  const totalPages = Math.ceil(totalComplaints / limit);

  return (
    <div className="space-y-6 max-w-8xl mx-auto pb-10">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Post-Market Surveillance Complaints
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track, investigate, and resolve medical device product complaints for{" "}
          <span className="font-semibold text-foreground">{orgSlug}</span>.
        </p>
      </div>

      {/* Complaints Action Toolbar & Dynamic Grid/List View */}
      <ComplaintsView orgSlug={orgSlug} complaints={complaints} />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={`/${orgSlug}/complaints?page=${page - 1}`} />
              </PaginationItem>
            )}
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              // Show limited pages logic (e.g. first, last, and around current)
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= page - 1 && pageNumber <= page + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink 
                      href={`/${orgSlug}/complaints?page=${pageNumber}`}
                      isActive={page === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                pageNumber === page - 2 ||
                pageNumber === page + 2
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}

            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={`/${orgSlug}/complaints?page=${page + 1}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
