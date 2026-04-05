import SwiftUI
import CoreData
import UIKit

struct DashboardView: View {
    @FetchRequest(
        entity: Egg.entity(),
        sortDescriptors: [NSSortDescriptor(key: "laidAt", ascending: false)],
        animation: .default)
    private var eggs: FetchedResults<Egg>

    @FetchRequest(
        entity: Chicken.entity(),
        sortDescriptors: [NSSortDescriptor(key: "createdAt", ascending: true)],
        animation: .default)
    private var chickens: FetchedResults<Chicken>

    // MARK: - Reactive computed stats (update automatically with FetchedResults)
    private var todayCount: Int {
        let cal = Calendar.current
        return eggs.filter { cal.isDateInToday($0.laidAt) }.count
    }
    private var weekCount: Int {
        let cal = Calendar.current
        return eggs.filter { cal.isDate($0.laidAt, equalTo: .now, toGranularity: .weekOfYear) }.count
    }
    private var monthCount: Int {
        let cal = Calendar.current
        return eggs.filter { cal.isDate($0.laidAt, equalTo: .now, toGranularity: .month) }.count
    }
    private var yearCount: Int {
        let cal = Calendar.current
        return eggs.filter { cal.isDate($0.laidAt, equalTo: .now, toGranularity: .year) }.count
    }

    // MARK: - Extracted sub‑views to help the Swift type‑checker
    @ViewBuilder
    private var gallerySection: some View {
        if chickens.isEmpty {
            ContentUnavailableView(
                "Noch keine Hühner",
                systemImage: "bird",
                description: Text("Füge dein erstes Huhn im Tab \"Hühner\" hinzu.")
            )
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(chickens) { chicken in
                        chickenButton(for: chicken)
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    @ViewBuilder
    private var statsSection: some View {
        KPIGrid(todayCount: todayCount,
                week: weekCount,
                month: monthCount,
                year: yearCount)
    }

    @ViewBuilder
    private func chickenButton(for chicken: Chicken) -> some View {
        Button {
            addEgg(for: chicken)
        } label: {
            VStack(spacing: 4) {
                if let uiImg = UIImage(data: chicken.photoData),
                   uiImg.size != .zero {
                    Image(uiImage: uiImg)
                        .resizable()
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.accentColor, lineWidth: 2))
                } else {
                    Image(systemName: "bird")
                        .resizable()
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.accentColor, lineWidth: 2))
                        .foregroundStyle(Color.accentColor)
                }
                Text(chicken.name)
                    .font(.caption)
                    .lineLimit(1)
            }
        }
        .accessibilityLabel("Ei bei \(chicken.name) hinzufügen")
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    gallerySection
                    statsSection
                }
                .padding()
            }
            .navigationTitle("Dashboard")
        }
    }

    private func addEgg(for chicken: Chicken) {
        guard let ctx = chicken.managedObjectContext else { return }
        let egg = Egg(context: ctx)
        egg.id = UUID()
        egg.laidAt = .now
        egg.chicken = chicken
        try? ctx.save()
    }
}

private struct KPIGrid: View {
    let todayCount: Int
    let week: Int
    let month: Int
    let year: Int

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            KPIView(title: "Heute",  value: todayCount)
            KPIView(title: "Woche",  value: week)
            KPIView(title: "Monat",  value: month)
            KPIView(title: "Jahr",   value: year)
        }
    }
}

private struct KPIView: View {
    var title: String
    var value: Int

    var body: some View {
        VStack {
            Text(title).font(.headline)
            Text("\(value)").font(.largeTitle.bold())
        }
        .frame(maxWidth: .infinity, minHeight: 80)
        .background(.thinMaterial)
        .cornerRadius(12)
    }
}
