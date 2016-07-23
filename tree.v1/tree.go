package tree

import (
	"bytes"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
	"strings"
)

type Node interface {
	AddRune(r rune, position int)
	SetParent(Node)
	WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error
	Print(indentation int)
	GetLength() int
	Persist(addresses ilex.AddressTable, slices *mgo.Collection) (ilex.AddressTable, error)
}

func indent(indentation int) {
	fmt.Print(strings.Repeat("  ", indentation))
}

func construct_tree_from_address_table(addresses ilex.AddressTable, total_length int) Node {
	if len(addresses) == 0 {
		return nil
	}
	if len(addresses) == 1 {
		return &PNode{Length: total_length, Address: addresses[0][1]}
	}

	var i, length_left int
	for ; i < len(addresses); i++ {
		if addresses[i][0] > total_length/2 {
			length_left = addresses[i][0]
			break
		}
	}

	if i == len(addresses) {
		i = len(addresses) - 1
		length_left = addresses[i][0]
	}

	left := construct_tree_from_address_table(addresses[:i], length_left)
	right := construct_tree_from_address_table(addresses[i:], total_length-length_left)
	root := &Branch{Length: total_length, LengthLeft: length_left, Left: left, Right: right}
	left.SetParent(root)
	right.SetParent(root)
	return root
}

func ConstructVersionTree(document_id string, version_no int) (root *Root) {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("database access error: " + err.Error())
		return nil
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	versions := database.C(ilex.VERSIONS)

	var version ilex.Version
	err = versions.Find(bson.M{"DocumentId": bson.ObjectIdHex(document_id),
		"No": version_no}).One(&version)
	if err != nil {
		fmt.Println("retrieving version error: " + err.Error())
		return nil
	}

	root = &Root{construct_tree_from_address_table(version.Addresses, version.Size)}
	root.Down.SetParent(root)
	return root
}

func GetTreeDump(root *Root) (string, error) {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("database access error: " + err.Error())
		return "", err
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	slices := database.C(ilex.PERMASCROLL)

	var buffer bytes.Buffer
	err = root.WriteToBuffer(&buffer, slices)
	if err != nil {
		fmt.Println("Tree dump error: " + err.Error())
		return "", err
	}
	return buffer.String(), nil
}

func PersistTree(root *Root) error {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("database access error: " + err.Error())
		return err
	}
	defer db_session.Close()

	database := db_session.DB(ilex.DEFAULT_DB)
	slices := database.C(ilex.PERMASCROLL)

	addresses := ilex.AddressTable{{0, 0}}
	addresses, err = root.Persist(addresses, slices)
	return nil
}
