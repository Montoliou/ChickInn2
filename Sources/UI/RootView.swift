import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar")
                }
            ReportsView()
                .tabItem {
                    Label("Auswertung", systemImage: "calendar")
                }
            ChickenListView()
                .tabItem {
                    Label("Chickens", systemImage: "bird")
                }
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
    }
}

struct ReportView: View {
    var body: some View {
        Text("Reports (coming soon)")
            .font(.title)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct SettingsView: View {
    var body: some View {
        Text("Settings (coming soon)")
            .font(.title)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
