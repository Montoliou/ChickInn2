//
//  ChickenDetailView.swift
//  ChickInn
//

import SwiftUI
import CoreData

// MARK: - Snapshot value-types
private struct EggSnapshot: Identifiable {
    let id: NSManagedObjectID
    let laidAt: Date
}
private struct MoultSnapshot: Identifiable {
    let id: NSManagedObjectID
    let startDate: Date
    let endDate: Date?
}
private struct MedSnapshot: Identifiable {
    let id: NSManagedObjectID
    let name: String
    let startDate: Date
    let endDate: Date?
    let notes: String?
}

// MARK: - Helper‑Extension (safe Core Data access)
extension Chicken {
    //  Using `compactMap` on the underlying `NSSet` avoids the costly
    //  Set‑bridging that tries to `copy` every managed object and crashes.
    fileprivate func eggSnaps() -> [EggSnapshot] {
        (eggs as NSSet).compactMap { $0 as? Egg }
            .sorted { $0.laidAt > $1.laidAt }
            .map { EggSnapshot(id: $0.objectID,
                               laidAt: $0.laidAt) }
    }

    fileprivate func moultSnaps() -> [MoultSnapshot] {
        (moultings as NSSet).compactMap { $0 as? MoultPeriod }
            .sorted { $0.startDate > $1.startDate }
            .map { MoultSnapshot(id: $0.objectID,
                                 startDate: $0.startDate,
                                 endDate: $0.endDate) }
    }

    fileprivate func medSnaps() -> [MedSnapshot] {
        (medications as NSSet).compactMap { $0 as? Medication }
            .sorted { $0.startDate > $1.startDate }
            .map { MedSnapshot(id: $0.objectID,
                               name: $0.name,
                               startDate: $0.startDate,
                               endDate: $0.endDate,
                               notes: $0.notes) }
    }
}

// MARK: - Detail View
struct ChickenDetailView: View {
    @Environment(\.managedObjectContext) private var ctx
    let chickenID: NSManagedObjectID

    @State private var chicken: Chicken?
    @State private var showAddMoult = false
    @State private var showAddMedication = false
    @State private var showEditChicken = false

    var body: some View {
        Group {
            if let chicken {
                Form {
                    Section {
                        ForEach(chicken.eggSnaps()) { egg in
                            Text(egg.laidAt.formatted(date: .abbreviated, time: .omitted))
                        }
                        .onDelete { offsets in
                            deleteEggs(snaps: chicken.eggSnaps(), at: offsets)
                        }
                    } header: {
                        Text("Eier")
                    }

                    Section {
                        ForEach(chicken.moultSnaps()) { m in
                            let end = m.endDate?.formatted(date: .abbreviated, time: .omitted) ?? "läuft"
                            Text("\(m.startDate.formatted(date: .abbreviated, time: .omitted)) – \(end)")
                        }
                        Button {
                            showAddMoult = true
                        } label: {
                            Label("Mauser erfassen", systemImage: "plus")
                        }
                    } header: {
                        Text("Mauser")
                    }

                    Section {
                        ForEach(chicken.medSnaps()) { med in
                            VStack(alignment: .leading) {
                                Text(med.name).bold()
                                Text("\(med.startDate.formatted(date: .abbreviated, time: .omitted)) – \(med.endDate?.formatted(date: .abbreviated, time: .omitted) ?? "")")
                                    .font(.footnote)
                            }
                        }
                        Button {
                            showAddMedication = true
                        } label: {
                            Label("Medikation erfassen", systemImage: "plus")
                        }
                    } header: {
                        Text("Medikation")
                    }
                }
                .navigationTitle(chicken.name)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Bearbeiten") { showEditChicken = true }
                    }
                }
                .sheet(isPresented: $showAddMoult, onDismiss: reloadChicken) {
                    AddMoultView(chickenID: chickenID)
                }
                .sheet(isPresented: $showAddMedication, onDismiss: reloadChicken) {
                    AddMedicationView(chickenID: chickenID)
                }
                .sheet(isPresented: $showEditChicken, onDismiss: reloadChicken) {
                    EditChickenView(chickenID: chickenID)
                }
            } else {
                ProgressView()
            }
        }
        // B3 fix: .task on the outer Group so it runs (and re-runs on id change)
        .task(id: chickenID) {
            reloadChicken()
        }
    }

    private func reloadChicken() {
        chicken = try? ctx.existingObject(with: chickenID) as? Chicken
    }

    private func deleteEggs(snaps: [EggSnapshot], at offsets: IndexSet) {
        for index in offsets {
            if let egg = try? ctx.existingObject(with: snaps[index].id) {
                ctx.delete(egg)
            }
        }
        try? ctx.save()
        reloadChicken()
    }
}
