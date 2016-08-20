package tree

import (
	"bytes"
	"errors"
	"fmt"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
	"strings"
)

type TreeBase interface {
	AddRune(r rune, position int)
	RemoveRune(position int)
	WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error
	Print(indentation int)
	GetLength() int
	Persist(addresses ilex.AddressTable, slices *mgo.Collection) (ilex.AddressTable, error)
}

type Parent interface {
	TreeBase
	ReplaceChild(previous, new Node)
	ReduceChild(former Node)
}

type Node interface {
	TreeBase
	SetParent(Parent)
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

func ConstructVersionTree(version *ilex.Version) (root *Root) {
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

func PersistTree(root *Root, version *ilex.Version) error {
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
	if err != nil {
		return err
	}
	len_addresses := len(addresses)
	if addresses[len_addresses-1][0] != root.GetLength() {
		return errors.New("The tree's length does not match it's address table!")
	}

	version.Finished = ilex.CurrentTime()
	version.Addresses = addresses[:len_addresses-1]
	version.Size = root.GetLength()

	versions := database.C(ilex.VERSIONS)
	return versions.Insert(version)
}
