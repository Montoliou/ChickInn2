import SwiftUI
import CoreData

struct AddMedicationView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var ctx

    let chickenID: NSManagedObjectID

    @State private var name = ""
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var notes = ""

    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $name)

                DatePicker("Beginn", selection: $startDate, displayedComponents: .date)
                DatePicker("Ende", selection: $endDate, in: startDate..., displayedComponents: .date)

                TextField("Notiz", text: $notes, axis: .vertical)
            }
            .navigationTitle("Medikation erfassen")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern", action: save)
                        .disabled(name.isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }

    private func save() {
        guard let chicken = try? ctx.existingObject(with: chickenID) as? Chicken else { return }
        let med = Medication(context: ctx)
        med.id = UUID()
        med.name = name
        med.startDate = startDate
        med.endDate = endDate
        med.notes = notes.isEmpty ? nil : notes
        med.chicken = chicken
        try? ctx.save()
        dismiss()
    }
}
