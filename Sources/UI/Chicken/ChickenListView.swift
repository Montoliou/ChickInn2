import SwiftUI
import CoreData
import UIKit

struct ChickenListView: View {
    @Environment(\.managedObjectContext) private var context
    @FetchRequest(
        entity: Chicken.entity(),
        sortDescriptors: [NSSortDescriptor(key: "createdAt", ascending: true)],
        animation: .default)
    private var chickens: FetchedResults<Chicken>

    @State private var showingAddChicken = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(chickens.map(\.objectID), id: \.self) { id in
                    NavigationLink {
                        ChickenDetailView(chickenID: id)
                    } label: {
                        ChickenRow(chickenID: id)
                    }
                }
                .onDelete(perform: delete)
            }
            .navigationTitle("Hühner")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddChicken = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddChicken) {
                AddChickenView()
            }
        }
    }

    private func delete(at offsets: IndexSet) {
        offsets.map { chickens[$0] }.forEach(context.delete)
        try? context.save()
    }
}

// MARK: - Lightweight Row
private struct ChickenRow: View {
    @Environment(\.managedObjectContext) private var ctx
    let chickenID: NSManagedObjectID

    var body: some View {
        if let chicken = try? ctx.existingObject(with: chickenID) as? Chicken {
            HStack {
                if let uiImg = UIImage(data: chicken.photoData),
                   uiImg.size != .zero {
                    Image(uiImage: uiImg)
                        .resizable()
                        .frame(width: 44, height: 44)
                        .clipShape(Circle())
                } else {
                    Image(systemName: "bird")
                        .resizable()
                        .frame(width: 44, height: 44)
                        .clipShape(Circle())
                }
                VStack(alignment: .leading) {
                    Text(chicken.name)
                    if let lastEgg = (chicken.eggs as NSSet)
                        .compactMap({ $0 as? Egg })
                        .sorted(by: { $0.laidAt > $1.laidAt })
                        .first {
                        Text("Letztes Ei: \(lastEgg.laidAt.formatted(date: .abbreviated, time: .omitted))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("Noch kein Ei erfasst")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}
