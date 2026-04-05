import SwiftUI
import PhotosUI
import CoreData

struct EditChickenView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var ctx

    let chickenID: NSManagedObjectID

    @State private var name = ""
    @State private var notes = ""
    @State private var photoItem: PhotosPickerItem?
    @State private var photoData: Data?

    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $name)

                PhotosPicker(selection: $photoItem, matching: .images) {
                    Label("Foto ändern", systemImage: "photo")
                }
                if let data = photoData, let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFit()
                }

                TextField("Notiz", text: $notes, axis: .vertical)
            }
            .navigationTitle("Huhn bearbeiten")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern", action: save)
                        .disabled(name.isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
            .onChange(of: photoItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self) {
                        photoData = data
                    }
                }
            }
            .task {
                if let chicken = try? ctx.existingObject(with: chickenID) as? Chicken {
                    name = chicken.name
                    notes = chicken.notes ?? ""
                    photoData = chicken.photoData.isEmpty ? nil : chicken.photoData
                }
            }
        }
    }

    private func save() {
        guard let chicken = try? ctx.existingObject(with: chickenID) as? Chicken else { return }
        chicken.name = name
        chicken.notes = notes.isEmpty ? nil : notes
        if let data = photoData {
            chicken.photoData = data
        }
        try? ctx.save()
        dismiss()
    }
}
