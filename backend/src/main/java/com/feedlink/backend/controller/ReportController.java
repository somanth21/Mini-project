package com.feedlink.backend.controller;

import com.feedlink.backend.entity.Donation;
import com.feedlink.backend.entity.DonationStatus;
import com.feedlink.backend.entity.Role;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.repository.DonationRepository;
import com.feedlink.backend.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ReportController {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @GetMapping("/impact")
    public ResponseEntity<?> downloadReport(
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal User user
    ) throws IOException {
        List<Donation> allDonations = donationRepository.findAll();
        List<Donation> userDonations;

        if (user.getRole() == Role.ADMIN) {
            userDonations = allDonations;
        } else if (user.getRole() == Role.HOTEL) {
            userDonations = allDonations.stream()
                    .filter(d -> d.getDonor().getId().equals(user.getId()))
                    .collect(Collectors.toList());
        } else {
            userDonations = allDonations.stream()
                    .filter(d -> d.getNgo() != null && d.getNgo().getId().equals(user.getId()))
                    .collect(Collectors.toList());
        }

        List<Donation> completed = userDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                .collect(Collectors.toList());

        int mealsSaved = completed.stream()
                .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                .sum();
        double weightSaved = mealsSaved * 0.5;
        double co2Saved = weightSaved * 2.5;

        if ("csv".equalsIgnoreCase(format)) {
            StringBuilder csv = new StringBuilder();
            csv.append("FeedLink AI Social Impact Report\n");
            csv.append("User:,").append(user.getName()).append(" (").append(user.getEmail()).append(")\n");
            csv.append("Role:,").append(user.getRole()).append("\n\n");
            
            csv.append("SUMMARY METRICS\n");
            csv.append("Total Meals Saved:,").append(mealsSaved).append("\n");
            csv.append("Total Food Rescued (kg):,").append(weightSaved).append("\n");
            csv.append("Total People Fed:,").append(mealsSaved).append("\n");
            csv.append("CO2 Saved (kg):,").append(co2Saved).append("\n");
            csv.append("Completed Donations:,").append(completed.size()).append("\n\n");

            csv.append("COMPLETED DONATIONS LIST\n");
            csv.append("ID,Food Type,Category,Quantity (Servings),Donor,NGO,Pickup Address,Date\n");
            for (Donation d : completed) {
                csv.append(d.getId()).append(",")
                        .append(escapeCsv(d.getFoodType())).append(",")
                        .append(escapeCsv(d.getCategory())).append(",")
                        .append(d.getQuantity()).append(",")
                        .append(escapeCsv(d.getDonor().getName())).append(",")
                        .append(d.getNgo() != null ? escapeCsv(d.getNgo().getName()) : "N/A").append(",")
                        .append(escapeCsv(d.getPickupAddress())).append(",")
                        .append(d.getCreatedAt() != null ? d.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : "").append("\n");
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=feedlink_impact_report.csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csv.toString());
        } else {
            // PDF generation using OpenPDF
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            try {
                PdfWriter.getInstance(document, out);
                document.open();
                
                // Add title
                Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
                Paragraph title = new Paragraph("FeedLink AI Social Impact Report", titleFont);
                title.setAlignment(Element.ALIGN_CENTER);
                title.setSpacingAfter(20);
                document.add(title);

                // Add User Info
                Paragraph info = new Paragraph("Generated For: " + user.getName() + " (" + user.getEmail() + ")\n" +
                        "Role: " + user.getRole() + "\n" +
                        "Date: " + java.time.LocalDate.now().toString() + "\n\n");
                document.add(info);

                // Add Summary Table
                Paragraph summaryTitle = new Paragraph("Summary Metrics", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
                summaryTitle.setSpacingAfter(10);
                document.add(summaryTitle);

                PdfPTable summaryTable = new PdfPTable(2);
                summaryTable.setWidthPercentage(100);
                summaryTable.addCell("Total Meals Saved");
                summaryTable.addCell(String.valueOf(mealsSaved));
                summaryTable.addCell("Total Food Rescued (kg)");
                summaryTable.addCell(String.valueOf(weightSaved));
                summaryTable.addCell("Total People Fed");
                summaryTable.addCell(String.valueOf(mealsSaved));
                summaryTable.addCell("CO2 Saved (kg)");
                summaryTable.addCell(String.valueOf(co2Saved));
                summaryTable.addCell("Completed Donations");
                summaryTable.addCell(String.valueOf(completed.size()));
                summaryTable.setSpacingAfter(20);
                document.add(summaryTable);

                // Add Donations Table
                Paragraph donationsTitle = new Paragraph("Completed Donations Details", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
                donationsTitle.setSpacingAfter(10);
                document.add(donationsTitle);

                PdfPTable donationsTable = new PdfPTable(5);
                donationsTable.setWidthPercentage(100);
                donationsTable.addCell("ID");
                donationsTable.addCell("Food Type");
                donationsTable.addCell("Quantity (Servings)");
                donationsTable.addCell("Donor");
                donationsTable.addCell("NGO");

                for (Donation d : completed) {
                    donationsTable.addCell(String.valueOf(d.getId()));
                    donationsTable.addCell(d.getFoodType());
                    donationsTable.addCell(String.valueOf(d.getQuantity()));
                    donationsTable.addCell(d.getDonor().getName());
                    donationsTable.addCell(d.getNgo() != null ? d.getNgo().getName() : "N/A");
                }
                document.add(donationsTable);

                document.close();
            } catch (Exception e) {
                e.printStackTrace();
            }

            byte[] pdfBytes = out.toByteArray();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=feedlink_impact_report.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        }
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
