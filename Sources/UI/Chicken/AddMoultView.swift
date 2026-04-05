import SwiftUI
import CoreData

struct AddMoultView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var ctx

    let chickenID: NSManagedObjectID

    @State private var startDate = Date()
    @State private var hasEndDate = false
    @State private var endDate = Date()
    @State private var notes = ""

    var body: some View {
        NavigationStack {
            Form {
                DatePicker("Beginn", selection: $startDate, displayedComponents: .date)

                Toggle("Abgeschlossen", isOn: $hasEndDate)
                if hasEndDate {
                    DatePicker("Ende", selection: $endDate, in: startDate..., displayedComponents: .date)
                }

                TextField("Notiz", text: $notes, axis: .vertical)
            }
            .navigationTitle("Mauser erfassen")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern", action: save)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }

    private func save() {
        guard let chicken = try? ctx.existingObject(with: chickenID) as? Chicken else { return }
        let moult = MoultPeriod(context: ctx)
        moult.id = UUID()
        moult.startDate = startDate
        moult.endDate = hasEndDate ? endDate : nil
        moult.notes = notes.isEmpty ? nil : notes
        moult.chicken = chicken
        try? ctx.save()
        dismiss()
    }
}
