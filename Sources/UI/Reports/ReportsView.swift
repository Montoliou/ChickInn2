import SwiftUI
import Charts
import CoreData

struct ReportsView: View {
    @FetchRequest(
        entity: Egg.entity(),
        sortDescriptors: [NSSortDescriptor(key: "laidAt", ascending: true)],
        animation: .default)
    private var eggs: FetchedResults<Egg>

    /// Aggregiert Eier nach Kalenderwoche (letzte 12 Wochen)
    private var weeklyData: [(week: String, count: Int)] {
        let cal = Calendar.current
        let now = Date()

        return (0..<12).reversed().compactMap { offset -> (String, Int)? in
            guard let weekStart = cal.date(byAdding: .weekOfYear, value: -offset, to: now) else { return nil }
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: weekStart)
            guard let year = comps.yearForWeekOfYear, let week = comps.weekOfYear else { return nil }

            let count = eggs.filter {
                let ec = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: $0.laidAt)
                return ec.yearForWeekOfYear == year && ec.weekOfYear == week
            }.count

            let label = "KW\(week)"
            return (label, count)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    if eggs.isEmpty {
                        ContentUnavailableView(
                            "Noch keine Daten",
                            systemImage: "chart.bar",
                            description: Text("Erfasse Eier im Dashboard, um hier Auswertungen zu sehen.")
                        )
                        .padding(.top, 60)
                    } else {
                        Text("Eierproduktion – letzte 12 Wochen")
                            .font(.headline)
                            .padding(.horizontal)

                        Chart(weeklyData, id: \.week) { entry in
                            BarMark(
                                x: .value("Woche", entry.week),
                                y: .value("Eier", entry.count)
                            )
                            .foregroundStyle(Color.accentColor)
                        }
                        .frame(height: 220)
                        .padding(.horizontal)

                        Divider()

                        totalStatsSection
                            .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Auswertung")
        }
    }

    @ViewBuilder
    private var totalStatsSection: some View {
        let total = eggs.count
        let perChickenMap = Dictionary(grouping: eggs, by: { $0.chicken?.name ?? "?" })
            .mapValues(\.count)
            .sorted { $0.value > $1.value }

        VStack(alignment: .leading, spacing: 12) {
            Text("Gesamt: \(total) Eier")
                .font(.subheadline).bold()

            ForEach(perChickenMap, id: \.key) { name, count in
                HStack {
                    Text(name)
                    Spacer()
                    Text("\(count) Eier")
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
